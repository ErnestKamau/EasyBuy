// app/help-support.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ToastService } from '@/utils/toastService';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  ChevronRight,
} from 'lucide-react-native';

export default function HelpSupportScreen() {
  const { currentTheme, themeName } = useTheme();

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const faqItems = [
    {
      question: 'How do I place an order?',
      answer: 'Browse products, add them to your cart, and proceed to checkout. Choose your payment method and delivery option, then confirm your order.',
    },
    {
      question: 'What payment methods are available?',
      answer: 'We accept Cash, M-Pesa, and Debt payment options. You can pay at pickup or via M-Pesa STK push.',
    },
    {
      question: 'Can I pay on debt?',
      answer: 'Yes, you can choose debt payment at checkout. The payment must be completed within 7 days. You will receive reminders 2 days before the due date.',
    },
    {
      question: 'What are the delivery options?',
      answer: 'You can choose between Pickup at Shop or Home Delivery. Pickup is free, while delivery charges may apply.',
    },
    {
      question: 'How do I track my order?',
      answer: 'Once your order is confirmed by the admin, you will receive a notification. You can check your order status in the Orders section.',
    },
    {
      question: 'What if I need to cancel an order?',
      answer: 'Contact support immediately if you need to cancel an order. Orders can only be cancelled before they are confirmed by the admin.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.primary }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Contact Us</Text>
          
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: currentTheme.surface }]}
            onPress={() => handleCall('+254700000000')}
          >
            <View style={[styles.contactIcon, { backgroundColor: `${currentTheme.primary}15` }]}>
              <Phone size={24} color={currentTheme.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={[styles.contactTitle, { color: currentTheme.text }]}>Phone</Text>
              <Text style={[styles.contactValue, { color: currentTheme.textSecondary }]}>
                +254 700 000 000
              </Text>
            </View>
            <ChevronRight size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: currentTheme.surface }]}
            onPress={() => handleEmail('support@easybuy.com')}
          >
            <View style={[styles.contactIcon, { backgroundColor: `${currentTheme.primary}15` }]}>
              <Mail size={24} color={currentTheme.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={[styles.contactTitle, { color: currentTheme.text }]}>Email</Text>
              <Text style={[styles.contactValue, { color: currentTheme.textSecondary }]}>
                support@easybuy.com
              </Text>
            </View>
            <ChevronRight size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: currentTheme.surface }]}
            onPress={() => ToastService.showInfo('Chat', 'Live chat support coming soon!')}
          >
            <View style={[styles.contactIcon, { backgroundColor: `${currentTheme.primary}15` }]}>
              <MessageCircle size={24} color={currentTheme.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={[styles.contactTitle, { color: currentTheme.text }]}>Live Chat</Text>
              <Text style={[styles.contactValue, { color: currentTheme.textSecondary }]}>
                Available 24/7
              </Text>
            </View>
            <ChevronRight size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={24} color={currentTheme.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.text, marginLeft: 8 }]}>
              Frequently Asked Questions
            </Text>
          </View>

          {faqItems.map((item, index) => (
            <View
              key={index}
              style={[styles.faqCard, { backgroundColor: currentTheme.surface }]}
            >
              <View style={styles.faqHeader}>
                <FileText size={20} color={currentTheme.primary} />
                <Text style={[styles.faqQuestion, { color: currentTheme.text }]}>
                  {item.question}
                </Text>
              </View>
              <Text style={[styles.faqAnswer, { color: currentTheme.textSecondary }]}>
                {item.answer}
              </Text>
            </View>
          ))}
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Support Hours</Text>
          <View style={[styles.hoursCard, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursDay, { color: currentTheme.text }]}>Monday - Friday</Text>
              <Text style={[styles.hoursTime, { color: currentTheme.textSecondary }]}>8:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursDay, { color: currentTheme.text }]}>Saturday</Text>
              <Text style={[styles.hoursTime, { color: currentTheme.textSecondary }]}>9:00 AM - 4:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursDay, { color: currentTheme.text }]}>Sunday</Text>
              <Text style={[styles.hoursTime, { color: currentTheme.textSecondary }]}>Closed</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 28,
  },
  hoursCard: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hoursDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  hoursTime: {
    fontSize: 14,
  },
});

